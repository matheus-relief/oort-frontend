import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { createFilterGroup } from '../../query-builder/query-builder-forms';
import { PipelineStage } from './pipeline/pipeline-stage.enum';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import get from 'lodash/get';

/** Creating a new instance of the FormBuilder class. */
const formBuilder = new FormBuilder();

/**
 * Creates an expression form.
 *
 * @param value initial value
 * @param validators boolean to set validators or not (default true)
 * @returns Expression form group.
 */
export const expressionForm = (value: any, validators = true): FormGroup =>
  formBuilder.group({
    operator: [
      get(value, 'operator', ''),
      validators ? Validators.required : null,
    ],
    field: [get(value, 'field', '')],
  });

/**
 * Creates a addFields stage form.
 *
 * @param value initial value
 * @param validators boolean to set validators or not (default true)
 * @returns Stage form group.
 */
export const addFieldsForm = (value: any, validators = true): FormGroup =>
  formBuilder.group({
    name: [get(value, 'name', ''), validators ? Validators.required : null],
    expression: expressionForm(get(value, 'expression', false)),
  });

/**
 * Create a groupBy rule form.
 *
 * @param value initial value
 * @returns GroupBy rule form group.
 */
export const groupByRuleForm = (value: any): FormGroup =>
  formBuilder.group({
    field: [get(value, 'field', ''), Validators.required],
    expression: expressionForm(get(value, 'expression', false), false),
  });

/**
 * Builds a stage form from its initial value.
 *
 * @param value Initial value of the form.
 * @returns Stage form group.
 */
export const addStage = (value: any): FormGroup => {
  switch (value.type) {
    case PipelineStage.FILTER: {
      return formBuilder.group({
        type: [PipelineStage.FILTER],
        form: createFilterGroup(value.form ? value.form : {}),
      });
    }
    case PipelineStage.SORT: {
      return formBuilder.group({
        type: [PipelineStage.SORT],
        form: formBuilder.group({
          field: [get(value, 'form.field', ''), Validators.required],
          order: [get(value, 'form.order', 'asc'), Validators.required],
        }),
      });
    }
    case PipelineStage.GROUP: {
      return formBuilder.group({
        type: [PipelineStage.GROUP],
        form: formBuilder.group({
          groupBy: formBuilder.array(
            get(value, 'form.groupBy', [{}]).map((x: any) => groupByRuleForm(x))
          ),
          addFields: formBuilder.array(
            get(value, 'form.addFields', []).map((x: any) =>
              addFieldsForm(x, false)
            )
          ),
        }),
      });
    }
    case PipelineStage.ADD_FIELDS: {
      return formBuilder.group({
        type: [PipelineStage.ADD_FIELDS],
        form: formBuilder.array(
          value.form
            ? value.form.map((x: any) => addFieldsForm(x))
            : [addFieldsForm(null)],
          Validators.required
        ),
      });
    }
    case PipelineStage.UNWIND: {
      return formBuilder.group({
        type: [PipelineStage.UNWIND],
        form: formBuilder.group({
          field: [get(value, 'form.field', ''), Validators.required],
        }),
      });
    }
    case PipelineStage.CUSTOM: {
      const formGroup = formBuilder.group({
        type: [PipelineStage.CUSTOM],
        form: formBuilder.group({
          raw: [get(value, 'form.raw', ''), Validators.required],
        }),
      });
      formGroup
        .get('form')
        ?.get('raw')
        ?.setValidators([Validators.required, jsonValidator]);
      return formGroup;
    }
    default: {
      return formBuilder.group({
        type: [PipelineStage.CUSTOM],
        form: formBuilder.group({
          raw: [get(value, 'form.raw', ''), Validators.required],
        }),
      });
    }
  }
};

/**
 * Exports the mapping fields
 *
 * @param widgetType type of chart widget
 * @returns The x and y axis
 */
export const mappingFields = (
  widgetType: string
): { name: string; required: boolean }[] => {
  const fields = [
    { name: 'category', required: true },
    { name: 'field', required: true },
  ];
  if (['bar', 'column', 'line'].includes(widgetType)) {
    fields.push({ name: 'series', required: false });
  }
  return fields;
};

/**
 * Create mapping form ( category / field / series )
 *
 * @param value current form value
 * @param widgetType type of chart widget
 * @returns New mapping form
 */
export const createMappingForm = (value: any, widgetType: string): FormGroup =>
  formBuilder.group(
    mappingFields(widgetType).reduce(
      (o, field) =>
        Object.assign(o, {
          [field.name]: [
            get(value, field.name, ''),
            field.required ? Validators.required : null,
          ],
        }),
      {}
    )
  );

/**
 * Generates a new aggregation form.
 *
 * @param value initial value
 * @param widgetType type of chart widget
 * @returns New aggregation form
 */
export const createAggregationForm = (
  value: any,
  widgetType: string
): FormGroup =>
  formBuilder.group({
    dataSource: [get(value, 'dataSource', null), Validators.required],
    sourceFields: [get(value, 'sourceFields', []), Validators.required],
    pipeline: formBuilder.array(
      value && value.pipeline && value.pipeline.length
        ? value.pipeline.map((x: any) => addStage(x))
        : []
    ),
    mapping: createMappingForm(get(value, 'mapping', null), widgetType),
  });

/**
 * Checks that the control value is a valid JSON.
 *
 * @param control the control value
 * @returns null if the control value is a valid JSON, an error otherwise
 */
const jsonValidator = (control: AbstractControl): ValidationErrors | null => {
  try {
    JSON.parse(control.value);
  } catch (e) {
    return { jsonInvalid: true };
  }

  return null;
};
